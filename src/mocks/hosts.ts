import { photos } from "./photos";
import type { Host } from "./types";

export const hosts: Host[] = [
  {
    id: "h1",
    handle: "sabaylive",
    name: "Sabay Live",
    avatar: photos.avatarMusic.url,
    bio: "Small rooms, loud bands. We put on live music nights across Metro Manila and Cebu.",
    city: "Quezon City",
    followers: 4820,
    payoutMasked: "•••• 4821",
  },
  {
    id: "h2",
    handle: "gawa",
    name: "Gawa Workshop Co.",
    avatar: photos.avatarWorkshop.url,
    bio: "Hands-on workshops for people who learn by making. Paint, film, food, and the occasional talk.",
    city: "Manila",
    followers: 1290,
    payoutMasked: "•••• 0937",
  },
  /* Storefront creators (v6 landing). Fictional people and collectives only. */
  {
    id: "h3",
    handle: "tawacollective",
    name: "Tawa Collective",
    avatar: photos.audience.url,
    bio: "Eight comics who run a weekly room in Manila and write every joke in Taglish first.",
    city: "Manila",
    followers: 2310,
    payoutMasked: "•••• 1172",
  },
  {
    id: "h4",
    handle: "hapag",
    name: "Hapag Supper Club",
    avatar: photos.longTable.url,
    bio: "Long tables, shared plates, and strangers who leave as friends. Dinners in Manila and Davao.",
    city: "Manila",
    followers: 980,
    payoutMasked: "•••• 5503",
  },
  {
    id: "h5",
    handle: "alonnights",
    name: "Alon Nights",
    avatar: photos.lasers.url,
    bio: "Big rooms and late finishes. We book the DJs and build the stages for club nights and festivals.",
    city: "Quezon City",
    followers: 7640,
    payoutMasked: "•••• 3390",
  },
];

export const hostById = (id: string) => hosts.find((h) => h.id === id);
export const hostByHandle = (handle: string) => hosts.find((h) => h.handle === handle);
