export default function JsonLd({ markup }: { markup?: string }) {
  const text = markup?.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(parsed) }}
      />
    );
  } catch {
    return null;
  }
}
