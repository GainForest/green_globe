/**
 * Approved organization DIDs for the GainForest green globe index.
 *
 * Source: Airtable Organizations grid view (approved orgs, excluding VCS-* projects)
 *
 * Purpose: DID-based allowlist for the green globe organization index. Only
 * organizations whose DID appears in this set are shown on the globe and in
 * search results. Using a Set provides O(1) lookup performance.
 *
 * How to update: Add or remove DIDs when the Airtable source changes. Each
 * entry should include an inline comment with the organization's display name
 * for maintainability.
 */
export const APPROVED_ORGANIZATION_DIDS: Set<string> = new Set([
  "did:plc:vxp4hnumhsq4frvlot2jxeg5", // Nemus Project
  "did:plc:f33zgpmtwsfvs4ivbwsztnxb", // Redemption DAO
  "did:plc:72jjv6k4l3tj2z5kptur7lue", // Reserva Natura Urbana El Corredor
  "did:plc:363wsjxy4x3h72qlbrfhbuuf", // Moss Amazon NFT
  "did:plc:hax2tzf4rpvfcz7ytxrgcp57", // Reserva Deja Vu
  "did:plc:n7hyllyszhopy62vkthpsbiu", // Northern Rangelands Trust
  "did:plc:ikwztfjka7aqkutbgzbyvn66", // Wells for Zoe
  "did:plc:y6oovsehm62hkctcwcovbss5", // XPrize Rainforest
  "did:plc:defetgjrgdyywmt5aenegzez", // Million Trees Project
  "did:plc:atvm4n35jgfmob4ztt6tkjga", // Eco House & Bayka
  "did:plc:23jvtsqvpoy6dj6skxwdxurn", // Klipinnibos Restoration Project
  "did:plc:r2xyrjheuatgl4qt4cqzfvyt", // Project Pulo
  "did:plc:576r32oszxua6i5qbu4vellm", // Vlinder Project
  "did:plc:cxwn7hsnsqmkq5okzwkijghg", // Mindanao Agroforestry
  "did:plc:gy34k7njmyajjmvllejtjtbf", // Youth Leading Environmental Change
  "did:plc:7ytlfrm5ebvkwnyxxcvuikdr", // Jamo Nursery
  "did:plc:n63gx2rtll6puqdbi7lc22ed", // La Cotinga Biological Station
  "did:plc:c5k2cet5ccuaprzmctvw2olw", // Reserva Natural Monte Alegre
  "did:plc:duwlhcytvgzs3344efxtgxu4", // Fork Forest
  "did:plc:glduojdswge75t4utrmqyxpn", // Centre for Sustainability PH
  "did:plc:tv7tjokt3dlrvs3niqtmp3gm", // Ecological Balance
  "did:plc:xe4gr4hqr7v2k63hblweeahr", // FtC - Builder Residency
  "did:plc:6be3rc5zc4ee6lnwdcmftskj", // Albertine Rural Restoration Alert
  "did:plc:mcgadjb5643gvnrjf6g23x72", // ForestBench Consortium
  "did:plc:zc56azgdaaja4cilggbkt7qs", // For the Future PH
  "did:plc:hnq7o6bhbtvuljpr6osxwhcx", // Kayapo Project
  "did:plc:qt6vq2jfrools2qel6n57q22", // Saving Planet
  "did:plc:gvczjr4nknfpi74j4a3m7evm", // Koko Dao
  "did:plc:g5aqhwxdw2tsbkgnmhuroxxm", // Joint Energy and Environment Projects
  "did:plc:57u4yqhrdkwukeehsysknbrp", // FORREST - Forest Regeneration and Environmental Sustainability Trust
  "did:plc:i5dus2fclndngqsddezv5k3w", // Agape Hand
  "did:plc:eckc6zcxqvtdg52salkorqsw", // Tribes and Natures Defenders
  "did:plc:6oxtzu7gxz7xcldvtwfh3bpt", // Oceanus Conservation
  "did:plc:je4bmysje3yvaxf2wwo643z3", // Xprize 2024
  "did:plc:hah76n5nmm4shd7dnavkdqvt", // South Rift Association of Landowners
  "did:plc:ou7k32zbibd5f4tnzwjj42ck", // Defensores del Chaco
  "did:plc:tqvpemixgacvryqybloya6hs", // Community-Based Environmental Conservation
  "did:plc:mxcduncsqkh4ntykdbibdb7v", // Masungi Georeserve Foundation
  "did:plc:6w76q2p76qy4ji4mowd7cxzs", // Pandu Alam Lestari Foundation
  "did:plc:tkq3bry3twn7f523zswgbbiw", // Brain Youth Group
  "did:plc:boqxv354kjjwscbug3hha5h7", // Sunflower EcoTech
  "did:plc:6mylncju6k7g54psf23qsdml", // Climatica Foundation
  "did:plc:5w2nrscrxthklb4cxruqf3hm", // Project Mocha
  "did:plc:sg5zqsqprdu6lj5eihjzq2no", // Ingles Project
  "did:plc:7frewrkg3twqaicoo4ww5xia", // Parque das Tribos
  "did:plc:s7wenprmh7h3tg3f5olxqeg3", // Inhaa-be
  "did:plc:c35kmvhkg6ca2dupooe5jhn3", // Precious Forests
  "did:plc:yh3vgf5rc6ex42dehuvuvs4g", // Ayowecca Uganda
  "did:plc:tlbrhtvhjpylakjizlvj43mp", // Bula Garden Tanzania
  "did:plc:7hsmga7g3szwr3pvancrjafw", // Blue Carbon Tanzania (BCT)
  "did:plc:6vqdgzeocehvrkj4ekxurmzt", // Wovoka, Inc.
  "did:plc:nwa5cdiw2hg24igg7yuvx2hi", // Bees and Trees Uganda
  "did:plc:unc7kdbqre5vcbw7ud73d67q", // Ginakev Farms
  "did:plc:4ykmwpiv2utdr46awtuxd27e", // Green Ambassadors' Club
  "did:plc:wq5khgdtzybzxh7zig7flndh", // Nature and People as One
  "did:plc:axibb3hd3od3635jhihwmohv", // XPRIZE Rainforest Finals
]);
