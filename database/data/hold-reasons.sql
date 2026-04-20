-- Hold closing reasons

INSERT INTO hold_item_closing_reasons (reason_text)
VALUES
  ('Fulfilled'),
  ('Canceled'),
  ('Canceled - item withdrawn from catalog'),
  ('Canceled - fine grace period expired'),
  ('Canceled - pickup window expired');
