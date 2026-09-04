/**
 * Renders one or more schema.org objects as <script type="application/ld+json">.
 *
 * `application/ld+json` is inert data (never executed), so it isn't governed by
 * the CSP `script-src` and needs no nonce. `<` is escaped to `<` so listing
 * names/descriptions (untrusted third-party text) can never break out of the
 * JSON string into an executable context.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(d).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
