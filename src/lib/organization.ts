/**
 * Single source of truth for verified official contact information & JSON-LD
 * for AI Mở Studio (heyaimo.com).
 * DO NOT modify these details without explicit instructions from the site owner.
 */

export const CONTACT_INFO = {
  organizationName: "AI Mở Studio",
  hotline: {
    display: "0988366917",
    name: "Jacky Tran",
    telLink: "tel:+84988366917",
    zaloLink: "https://zalo.me/0988366917",
  },
  emailPrimary: {
    address: "tranngochoanganh6789@gmail.com",
    role: "Email liên hệ chính",
    link: "mailto:tranngochoanganh6789@gmail.com",
  },
  emailSupport: {
    address: "hello@aimo.vn",
    role: "Email hỗ trợ",
    note: "phản hồi trong một ngày làm việc",
    link: "mailto:hello@aimo.vn",
  },
  facebook: {
    label: "Facebook AI Mở",
    url: "https://www.facebook.com/profile.php?id=61578017391586",
  },
  address: {
    full: "1013 Cách Mạng Tháng 8, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh",
    street: "1013 Cách Mạng Tháng 8",
    locality: "Phường Thủ Dầu Một",
    region: "Thành phố Hồ Chí Minh",
    country: "VN",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=1013+C%C3%A1ch+M%E1%BA%A1ng+Th%C3%A1ng+8%2C+Ph%C6%B0%E1%BB%9Dng+Th%E1%BB%A7+D%E1%BA%A7u+M%E1%BB%99t%2C+Th%C3%A0nh+ph%E1%BB%91+H%E1%BB%93+Ch%C3%AD+Minh",
  },
  contactPageUrl: "/lien-he",
} as const;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AI Mở Studio",
  url: "https://www.heyaimo.com/",
  email: "tranngochoanganh6789@gmail.com",
  telephone: "+84988366917",
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@aimo.vn",
      telephone: "+84988366917",
      description: "phản hồi trong một ngày làm việc",
    },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "1013 Cách Mạng Tháng 8",
    addressLocality: "Phường Thủ Dầu Một",
    addressRegion: "Thành phố Hồ Chí Minh",
    addressCountry: "VN",
  },
  sameAs: [
    "https://www.facebook.com/profile.php?id=61578017391586",
  ],
} as const;
