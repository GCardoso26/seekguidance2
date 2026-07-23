-- Sprint 3: honest store ratings — never show seed review_count without shop_reviews

UPDATE tcg_judge.stores s
SET average_rating = 0,
    review_count = 0,
    updated_at = now()
WHERE COALESCE(s.review_count, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM tcg_judge.shop_reviews r WHERE r.store_id = s.id
  );
