import type { Photo } from "./types";

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

/** Unsplash photos, checked by eye for fit. Keyed by what they show. */
export const photos = {
  stagePurple: { id: "1516450360452-9312f5e86fc7", url: u("1516450360452-9312f5e86fc7"), alt: "Singer on a purple-lit stage above a crowd" },
  crowdHeart: { id: "1429962714451-bb934ecdc4ec", url: u("1429962714451-bb934ecdc4ec"), alt: "Crowd making heart shapes with their hands at a concert" },
  crowdFaces: { id: "1501386761578-eac5c94b800a", url: u("1501386761578-eac5c94b800a"), alt: "Fans cheering at the front of a show" },
  singerSmoke: { id: "1493225457124-a3eb161ffa5f", url: u("1493225457124-a3eb161ffa5f"), alt: "Performer with a raised arm in stage smoke" },
  lasers: { id: "1514525253161-7a46d19cd819", url: u("1514525253161-7a46d19cd819"), alt: "Green and blue lasers over a festival crowd" },
  festivalPurple: { id: "1506157786151-b8491531f063", url: u("1506157786151-b8491531f063"), alt: "Festival main stage with phones raised" },
  confettiNight: { id: "1533174072545-7a4b6ad7a6c3", url: u("1533174072545-7a4b6ad7a6c3"), alt: "Confetti falling over a night crowd" },
  confettiHall: { id: "1492684223066-81342ee5ff30", url: u("1492684223066-81342ee5ff30"), alt: "Confetti cannons over an indoor crowd" },
  neonSign: { id: "1508700115892-45ecd05ae2ad", url: u("1508700115892-45ecd05ae2ad"), alt: "Neon sign on a brick wall reading you are what you listen to" },
  microphone: { id: "1475721027785-f74eccf877e2", url: u("1475721027785-f74eccf877e2"), alt: "Microphone on a stand in front of a seated audience" },
  warmStage: { id: "1524368535928-5b5e00ddc76b", url: u("1524368535928-5b5e00ddc76b"), alt: "Hands raised toward a warm amber stage" },
  amberBurst: { id: "1470229722913-7c0e2dbbafd3", url: u("1470229722913-7c0e2dbbafd3"), alt: "Amber stage lights over a large crowd" },
  stringLights: { id: "1517457373958-b7bdd4587205", url: u("1517457373958-b7bdd4587205"), alt: "Crowd under string lights at an outdoor party" },
  brushes: { id: "1460661419201-fd4cecdf8a8b", url: u("1460661419201-fd4cecdf8a8b"), alt: "Paint-stained brushes in many colors" },
  paintStroke: { id: "1513364776144-60967b0f800f", url: u("1513364776144-60967b0f800f"), alt: "Brush laying a stroke of orange paint" },
  camera: { id: "1542038784456-1ea8e935640e", url: u("1542038784456-1ea8e935640e"), alt: "Photographer holding out a camera in an autumn forest" },
  keynote: { id: "1505373877841-8d25f7d46678", url: u("1505373877841-8d25f7d46678"), alt: "Speaker presenting on a large screen to an audience" },
  audience: { id: "1540575467063-178a50c2df87", url: u("1540575467063-178a50c2df87"), alt: "Seated audience facing a stage" },
  meetupTalk: { id: "1556761175-5973dc0f32e7", url: u("1556761175-5973dc0f32e7"), alt: "Person speaking to a small group in a brick office" },
  clapper: { id: "1485846234645-a62644f84728", url: u("1485846234645-a62644f84728"), alt: "Film clapperboard held up against a desert sky" },
  grill: { id: "1555939594-58d7cb561ad1", url: u("1555939594-58d7cb561ad1"), alt: "Grilled meats and vegetables on a board" },
  dinner: { id: "1414235077428-338989a2e8c0", url: u("1414235077428-338989a2e8c0"), alt: "Plated dinner on a set table" },
  longTable: { id: "1528605248644-14dd04022da1", url: u("1528605248644-14dd04022da1"), alt: "Friends sharing food at a long table" },
  yoga: { id: "1544367567-0f2fcb009e0b", url: u("1544367567-0f2fcb009e0b"), alt: "Person in a yoga pose against a sunset" },
  curtain: { id: "1503095396549-807759245b35", url: u("1503095396549-807759245b35"), alt: "Silhouettes of performers before a red curtain" },
  dj: { id: "1496337589254-7e19d01cec44", url: u("1496337589254-7e19d01cec44"), alt: "DJ playing to a club crowd" },
  avatarMusic: { id: "1459749411175-04bf5292ceea", url: u("1459749411175-04bf5292ceea"), alt: "Sabay Live" },
  avatarWorkshop: { id: "1513364776144-60967b0f800f", url: u("1513364776144-60967b0f800f"), alt: "Gawa Workshop Co." },
  fan: { id: "1438761681033-6461ffad8d80", url: u("1438761681033-6461ffad8d80"), alt: "Ana Reyes" },
} satisfies Record<string, Photo>;

/** Sized Unsplash URL. */
export function img(p: Photo | string, w: number, h?: number): string {
  const url = typeof p === "string" ? p : p.url;
  const params = new URLSearchParams({ w: String(w), q: "75", auto: "format" });
  if (h) {
    params.set("h", String(h));
    params.set("fit", "crop");
  }
  return `${url}?${params}`;
}
