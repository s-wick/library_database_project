BEGIN
  DECLARE item_value DECIMAL(8,2) DEFAULT 0;

  SELECT COALESCE(i.monetary_value, 0)
    INTO item_value
    FROM item i
   WHERE i.item_id = NEW.item_id
   LIMIT 1;

  SET NEW.amount = LEAST(GREATEST(COALESCE(NEW.amount, 0), 0), item_value);
  SET NEW.amount_paid = LEAST(GREATEST(COALESCE(NEW.amount_paid, 0), 0), NEW.amount);
END