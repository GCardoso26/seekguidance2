import pg from "pg";
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const cards = await p.query(
  `SELECT COUNT(*)::int AS n FROM catalog.catalog_cards c
   JOIN catalog.catalog_games g ON g.id=c.game_id WHERE g.code='LORCANA'`,
);
const names = await p.query(
  `SELECT c.name FROM catalog.catalog_cards c
   JOIN catalog.catalog_games g ON g.id=c.game_id WHERE g.code='LORCANA' ORDER BY c.name`,
);
console.log(JSON.stringify({ lorcana_cards: cards.rows[0].n, names: names.rows.map((r) => r.name) }, null, 2));
await p.end();
