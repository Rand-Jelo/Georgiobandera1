export async function GET() {
    return new Response(
        'google-site-verification: google3c536045b16c6a1e.html',
        {
            headers: {
                'Content-Type': 'text/html',
            },
        }
    );
}
