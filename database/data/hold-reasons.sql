-- Hold closing reasons

INSERT INTO hold_item_closing_reasons (reason_text)
VALUES
  ('Fulfilled'),
  ('Canceled'),
  ('Canceled by fine'),
  ('Canceled by fine (grace expired)'),
  ('Canceled - pickup window expired');
