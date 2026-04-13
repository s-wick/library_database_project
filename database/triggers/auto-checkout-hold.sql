BEGIN
  DECLARE v_done TINYINT(1) DEFAULT 0;
  DECLARE v_stock_to_allocate INT DEFAULT 0;
  DECLARE v_hold_user_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_hold_request_date DATETIME DEFAULT NULL;
  DECLARE v_is_faculty TINYINT(1) DEFAULT 0;
  DECLARE v_borrow_limit INT DEFAULT 3;
  DECLARE v_active_count INT DEFAULT 0;
  DECLARE v_has_unpaid_fine INT DEFAULT 0;
  DECLARE v_checkout_ts DATETIME DEFAULT NULL;
  DECLARE v_insert_failed TINYINT(1) DEFAULT 0;

  DECLARE hold_cursor CURSOR FOR
    SELECT h.user_id, h.request_date
    FROM hold_item h
    WHERE h.item_id = NEW.item_id
    ORDER BY h.request_date ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '45000' SET v_insert_failed = 1;

  IF NEW.inventory > OLD.inventory THEN
    SET v_stock_to_allocate = NEW.inventory - OLD.inventory;

    OPEN hold_cursor;

    hold_loop: LOOP
      IF v_stock_to_allocate <= 0 THEN
        LEAVE hold_loop;
      END IF;

      FETCH hold_cursor INTO v_hold_user_id, v_hold_request_date;

      IF v_done = 1 THEN
        LEAVE hold_loop;
      END IF;

      SELECT COUNT(*)
        INTO v_has_unpaid_fine
        FROM fined_for f
       WHERE f.user_id = v_hold_user_id
         AND COALESCE(f.amount, 0) > COALESCE(f.amount_paid, 0);

      IF v_has_unpaid_fine > 0 THEN
        INSERT INTO user_notification (
          user_id,
          item_id,
          notification_type,
          message
        )
        VALUES (
          v_hold_user_id,
          NEW.item_id,
          (
            SELECT notification_type_id
            FROM user_notification_type
            WHERE notification_type_text = 'Removed hold'
            LIMIT 1
          ),
          CONCAT(
            'Your hold for "',
            NEW.title,
            '" was removed because your account has unpaid fines.'
          )
        );

        DELETE FROM hold_item
         WHERE item_id = NEW.item_id
           AND user_id = v_hold_user_id
           AND request_date = v_hold_request_date;

        ITERATE hold_loop;
      END IF;

      SELECT COALESCE(ua.is_faculty, 0)
        INTO v_is_faculty
        FROM user_account ua
       WHERE ua.user_id = v_hold_user_id
       LIMIT 1;

      SET v_borrow_limit = IF(v_is_faculty = 1, 6, 3);

      SELECT COUNT(*)
        INTO v_active_count
        FROM borrow b
       WHERE b.user_id = v_hold_user_id
         AND b.return_date IS NULL;

      IF v_active_count >= v_borrow_limit THEN
        ITERATE hold_loop;
      END IF;

      SET v_checkout_ts = NOW();
      SET v_insert_failed = 0;

      INSERT INTO borrow (item_id, user_id, checkout_date, due_date)
      VALUES (
        NEW.item_id,
        v_hold_user_id,
        v_checkout_ts,
        DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY)
      );

      IF v_insert_failed = 1 THEN
        ITERATE hold_loop;
      END IF;

      INSERT INTO user_notification (
        user_id,
        item_id,
        notification_type,
        message
      )
      VALUES (
        v_hold_user_id,
        NEW.item_id,
        (
          SELECT notification_type_id
          FROM user_notification_type
          WHERE notification_type_text = 'Checked out item'
          LIMIT 1
        ),
        CONCAT(
          'Your hold for "',
          NEW.title,
          '" has been checked out to your account. It is due on ',
          DATE_FORMAT(
            DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY),
            '%Y-%m-%d'
          ),
          '.'
        )
      );

      DELETE FROM hold_item
       WHERE item_id = NEW.item_id
         AND user_id = v_hold_user_id
         AND request_date = v_hold_request_date;

      SET NEW.inventory = NEW.inventory - 1;
      SET v_stock_to_allocate = v_stock_to_allocate - 1;
    END LOOP;

    CLOSE hold_cursor;
  END IF;
END