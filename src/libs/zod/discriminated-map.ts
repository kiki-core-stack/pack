import { objectEntries } from 'ts-extras';
import * as z from 'zod';

type InputSchemaOption<
    Discriminator extends string,
    ValueKey extends string,
    Schemas extends SchemaMap,
    Shape extends z.ZodRawShape,
    Key extends keyof Schemas,
> = z.ZodObject<
  & Omit<Shape, Discriminator | ValueKey>
  & { [P in Discriminator]: z.ZodLiteral<Key & z.core.util.Literal> }
  & { [P in ValueKey]: Schemas[Key] }
>;

type SchemaMap = Readonly<Record<number | string, z.ZodType>>;

// Functions

/**
 * Values whose schema depends on a discriminator, e.g. provider configs by `code` or log metadata by `type`, defined
 * once as a map of discriminator value to schema:
 *
 * - `inputSchema(shape)`: the discriminated union of `shape` plus the discriminator and the value, for inputs that
 *   carry the discriminator themselves (e.g. a provider form with `code`).
 * - `parse(key, value)` / `safeParse(key, value)`: validates only the value when the discriminator is already known
 *   (e.g. stored on the document, a route parameter or a job type).
 *
 * Issues of the value are reported under `<valueKey>.*` either way, like any other input field. Numeric keys of
 * `schemas` are numeric enum values.
 */
export function discriminatedMap<
    const Discriminator extends string,
    const ValueKey extends string,
    const Schemas extends SchemaMap,
>(discriminator: Discriminator, valueKey: ValueKey, schemas: Schemas) {
    // Built once per key and reused: parsing may be on hot paths (e.g. every published job).
    const wrappedSchemas = new Map<keyof Schemas, z.ZodObject>();
    const wrapValue = (key: keyof Schemas) => {
        let wrappedSchema = wrappedSchemas.get(key);
        if (!wrappedSchema) wrappedSchemas.set(key, wrappedSchema = z.object({ [valueKey]: schemas[key]! }));
        return wrappedSchema;
    };

    return {
        discriminator,
        inputSchema<Shape extends z.ZodRawShape = Record<never, never>>(shape?: Shape) {
            const options = objectEntries(schemas).map(([key, schema]) => z.object({
                ...shape,
                [discriminator]: z.literal(/^-?\d+$/.test(key) ? Number(key) : key),
                [valueKey]: schema,
            }));

            return z.discriminatedUnion(
                discriminator,
                options as unknown as [z.ZodObject, ...z.ZodObject[]],
            ) as unknown as z.ZodDiscriminatedUnion<
                Array<{
                    [Key in keyof Schemas]: InputSchemaOption<Discriminator, ValueKey, Schemas, Shape, Key>
                }[keyof Schemas]>,
                Discriminator
            >;
        },
        async parse<K extends keyof Schemas>(key: K, value: unknown) {
            const parsed = await wrapValue(key).parseAsync({ [valueKey]: value });
            return parsed[valueKey] as z.output<Schemas[K]>;
        },
        /**
         * Like `parse`, but returns the issues (paths under `<valueKey>.*`) instead of throwing.
         */
        async safeParse<K extends keyof Schemas>(
            key: K,
            value: unknown,
        ): Promise<{ data: z.output<Schemas[K]>; success: true } | { error: z.ZodError; success: false }> {
            const result = await wrapValue(key).safeParseAsync({ [valueKey]: value });
            if (!result.success) {
                return {
                    error: result.error,
                    success: false,
                };
            }

            return {
                data: result.data[valueKey] as z.output<Schemas[K]>,
                success: true,
            };
        },
        schemas,
        valueKey,
    };
}
