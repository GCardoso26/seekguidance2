import type { Metadata } from "next";
import { PublicProfileView } from "@/components/profile-v2/PublicProfileView";
import { withCanonical } from "@/lib/page-metadata";
import { brand } from "@/lib/brand";
import { publicProfilePath } from "@/lib/profile-v2";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const path = publicProfilePath(username);
  const title = `${username} — Jogador | ${brand.shortName}`;
  const description = `Perfil público de ${username} no JudgeTCG — decks, conquistas e jornada.`;

  return withCanonical(path, {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: brand.ogImagePath }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [brand.ogImagePath],
      ...(brand.twitterHandle ? { site: brand.twitterHandle } : {}),
    },
    robots: { index: true, follow: true },
  });
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <>
      <PublicProfileView username={username} section="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            name: username,
            url: `${brand.url.replace(/\/$/, "")}${publicProfilePath(username)}`,
            mainEntity: {
              "@type": "Person",
              name: username,
              url: `${brand.url.replace(/\/$/, "")}${publicProfilePath(username)}`,
            },
          }),
        }}
      />
    </>
  );
}
