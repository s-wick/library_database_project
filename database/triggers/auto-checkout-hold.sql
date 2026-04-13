DELIMITER ;;

CREATE TRIGGER auto_checkout_holds
AFTER UPDATE ON borrow
FOR EACH ROW
BEGIN
	DECLARE v_done TINYINT(1) DEFAULT 0;
	DECLARE v_hold_user_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_hold_request_datetime DATETIME DEFAULT NULL;
	DECLARE v_is_faculty TINYINT(1) DEFAULT 0;
	DECLARE v_borrow_limit INT DEFAULT 3;
	DECLARE v_active_count INT DEFAULT 0;
	DECLARE v_has_unpaid_fine INT DEFAULT 0;
	DECLARE v_checkout_ts DATETIME DEFAULT NULL;
	DECLARE v_removed_hold_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_checked_out_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_fine_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_fulfilled_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_item_title VARCHAR(100) DEFAULT NULL;

	DECLARE hold_cursor CURSOR FOR
		SELECT h.user_id, h.request_datetime
		FROM hold_item h
		WHERE h.item_id = NEW.item_id
			AND h.close_datetime IS NULL
		ORDER BY h.request_datetime ASC;

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

	IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
		SELECT title
			INTO v_item_title
			FROM item
		 WHERE item_id = NEW.item_id
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_removed_hold_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_checked_out_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Checked out item'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_fine_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_fulfilled_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Fulfilled'
		 LIMIT 1;

		OPEN hold_cursor;

		hold_loop: LOOP
			FETCH hold_cursor INTO v_hold_user_id, v_hold_request_datetime;

			IF v_done = 1 THEN
				LEAVE hold_loop;
			END IF;

			SELECT COUNT(*)
				INTO v_has_unpaid_fine
				FROM fined_for f
			 WHERE f.user_id = v_hold_user_id
				 AND COALESCE(f.amount, 0) > COALESCE(f.amount_paid, 0);

			IF v_has_unpaid_fine > 0 THEN
				IF v_removed_hold_type_id IS NOT NULL THEN
					INSERT INTO user_notification (
						user_id,
						item_id,
						notification_type,
						message
					)
					VALUES (
						v_hold_user_id,
						NEW.item_id,
						v_removed_hold_type_id,
						CONCAT(
							'Your hold for "',
							COALESCE(v_item_title, NEW.item_id),
							'" was removed because your account has unpaid fines.'
						)
					);
				END IF;

				UPDATE hold_item
					 SET close_datetime = NOW(),
							 close_reason_id = v_close_reason_fine_id
				 WHERE item_id = NEW.item_id
					 AND user_id = v_hold_user_id
					 AND request_datetime = v_hold_request_datetime
					 AND close_datetime IS NULL;

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
			INSERT INTO borrow (item_id, user_id, checkout_date, due_date)
			VALUES (
				NEW.item_id,
				v_hold_user_id,
				v_checkout_ts,
				DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY)
			);

			IF v_checked_out_type_id IS NOT NULL THEN
				INSERT INTO user_notification (
					user_id,
					item_id,
					notification_type,
					message
				)
				VALUES (
					v_hold_user_id,
					NEW.item_id,
					v_checked_out_type_id,
					CONCAT(
						'Your hold for "',
						COALESCE(v_item_title, NEW.item_id),
						'" has been checked out to your account. It is due on ',
						DATE_FORMAT(
							DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY),
							'%Y-%m-%d'
						),
						'.'
					)
				);
			END IF;

			UPDATE hold_item
				 SET close_datetime = NOW(),
						 close_reason_id = v_close_reason_fulfilled_id
			 WHERE item_id = NEW.item_id
				 AND user_id = v_hold_user_id
				 AND request_datetime = v_hold_request_datetime
				 AND close_datetime IS NULL;

			LEAVE hold_loop;
		END LOOP;

		CLOSE hold_cursor;
	END IF;
END;;

DELIMITER;