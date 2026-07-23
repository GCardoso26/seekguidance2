-- Defense-in-depth: align new gap tables with marketplace.listings/sellers RLS
ALTER TABLE pricing.price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing.price_quote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing.aggregated_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.listing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.listing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.seller_metrics ENABLE ROW LEVEL SECURITY;
