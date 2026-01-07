
async function test() {
    try {
        console.log("Fetching /api/chat/unread-counts...");
        // Use a generic fetch if possible, or assume localhost:3000
        const res = await fetch("http://localhost:3000/api/chat/unread-counts");
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response Body (raw):", text);
        try {
            const data = JSON.parse(text);
            console.log("Parsed JSON:", JSON.stringify(data, null, 2));
        } catch (je) {
            console.log("Response is not JSON");
        }
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}
test();
