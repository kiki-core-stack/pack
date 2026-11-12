/**
 * Fetches a development backend route that answers with the API success envelope and returns its `data`.
 */
export async function fetchApiData<T>(url: string) {
    const response = await fetch(url);
    const responseData = await response.json() as { data?: T; success: boolean };
    if (!responseData.success) throw new Error(`Failed to get ${url}`);
    return responseData.data as T;
}
