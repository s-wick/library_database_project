BEGIN
  IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
    INSERT INTO user_notification (
      user_id,
      item_id,
      notification_type,
      message
    )
    SELECT
      h.user_id,
      h.item_id,
      (
        SELECT notification_type_id
        FROM user_notification_type
        WHERE notification_type_text = 'Removed hold'
        LIMIT 1
      ),
      CONCAT(
        'Your hold for "',
        i.title,
        '" was removed because your account has unpaid fines.'
      )
    FROM hold_item h
    INNER JOIN item i
      ON i.item_id = h.item_id
    WHERE h.user_id = NEW.user_id;

    DELETE FROM hold_item
     WHERE user_id = NEW.user_id;
  END IF;
END