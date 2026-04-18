DELIMITER ;;

-- When an item is returned, mark the next eligible hold as ready for pickup.
CREATE TRIGGER auto_checkout_holds
AFTER UPDATE ON borrow
FOR EACH ROW
BEGIN
	DECLARE v_done TINYINT(1) DEFAULT 0;
	DECLARE v_hold_user_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_hold_request_datetime DATETIME DEFAULT NULL;
	DECLARE v_has_unpaid_fine INT DEFAULT 0;
	DECLARE v_hold_grace_expires_at DATETIME DEFAULT NULL;
	DECLARE v_hold_pickup_expires_at DATETIME DEFAULT NULL;
	DECLARE v_grace_started_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_pickup_ready_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_removed_hold_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_fine_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_pickup_expired_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_item_title VARCHAR(100) DEFAULT NULL;

	DECLARE hold_cursor CURSOR FOR
		SELECT h.user_id, h.request_datetime, h.grace_expires_at, h.pickup_expires_at
		FROM hold_item h
		WHERE h.item_id = NEW.item_id
			AND h.close_datetime IS NULL
		ORDER BY h.request_datetime ASC;

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

	-- Only react when a borrow transitions from active to returned.
	IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
		SELECT title
			INTO v_item_title
			FROM item
		 WHERE item_id = NEW.item_id
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_grace_started_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Hold grace started'
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_removed_hold_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_pickup_ready_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Hold ready for pickup'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_fine_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine (grace expired)'
		 LIMIT 1;

		IF v_close_reason_fine_id IS NULL THEN
			SELECT reason_id
				INTO v_close_reason_fine_id
				FROM hold_item_closing_reasons
			 WHERE reason_text = 'Canceled by fine'
			 LIMIT 1;
		END IF;

		SELECT reason_id
			INTO v_close_reason_pickup_expired_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled - pickup window expired'
		 LIMIT 1;

		IF v_close_reason_pickup_expired_id IS NULL THEN
			SELECT reason_id
				INTO v_close_reason_pickup_expired_id
				FROM hold_item_closing_reasons
			 WHERE reason_text = 'Canceled'
			 LIMIT 1;
		END IF;

		OPEN hold_cursor;

		hold_loop: LOOP
			FETCH hold_cursor INTO v_hold_user_id, v_hold_request_datetime, v_hold_grace_expires_at, v_hold_pickup_expires_at;

			IF v_done = 1 THEN
				LEAVE hold_loop;
			END IF;

			SELECT COUNT(*)
				INTO v_has_unpaid_fine
				FROM fined_for f
			 WHERE f.user_id = v_hold_user_id
				 AND COALESCE(f.amount, 0) > COALESCE(f.amount_paid, 0);

			IF v_has_unpaid_fine > 0 THEN
				IF v_hold_grace_expires_at IS NULL THEN
					UPDATE hold_item
						 SET grace_started_at = NOW(),
								 grace_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR),
								 pickup_ready_at = NOW(),
								 pickup_expires_at = DATE_ADD(NOW(), INTERVAL 72 HOUR)
					 WHERE item_id = NEW.item_id
						 AND user_id = v_hold_user_id
						 AND request_datetime = v_hold_request_datetime
						 AND close_datetime IS NULL
						 AND grace_expires_at IS NULL;

					IF v_grace_started_type_id IS NOT NULL THEN
						INSERT INTO user_notification (
							user_id,
							item_id,
							notification_type,
							message
						)
						VALUES (
							v_hold_user_id,
							NEW.item_id,
							v_grace_started_type_id,
							CONCAT(
								'Your hold for "',
								COALESCE(v_item_title, NEW.item_id),
								'" entered a 24-hour grace period because your account has unpaid fines. ',
								'Pay within 24 hours to keep this hold active.'
							)
						);
					END IF;

					IF v_pickup_ready_type_id IS NOT NULL THEN
						INSERT INTO user_notification (
							user_id,
							item_id,
							notification_type,
							message
						)
						VALUES (
							v_hold_user_id,
							NEW.item_id,
							v_pickup_ready_type_id,
							CONCAT(
								'Your hold for "',
								COALESCE(v_item_title, NEW.item_id),
								'" is ready for pickup, but you must pay your overdue fines before pickup can be completed.'
							)
						);
					END IF;

					LEAVE hold_loop;
				END IF;

				IF v_hold_grace_expires_at > NOW() THEN
					UPDATE hold_item
						 SET pickup_ready_at = NOW(),
								 pickup_expires_at = DATE_ADD(NOW(), INTERVAL 72 HOUR)
					 WHERE item_id = NEW.item_id
						 AND user_id = v_hold_user_id
						 AND request_datetime = v_hold_request_datetime
						 AND close_datetime IS NULL
						 AND pickup_expires_at IS NULL;

					IF v_pickup_ready_type_id IS NOT NULL
						 AND v_hold_pickup_expires_at IS NULL THEN
						INSERT INTO user_notification (
							user_id,
							item_id,
							notification_type,
							message
						)
						VALUES (
							v_hold_user_id,
							NEW.item_id,
							v_pickup_ready_type_id,
							CONCAT(
								'Your hold for "',
								COALESCE(v_item_title, NEW.item_id),
								'" is ready for pickup, but you must pay your overdue fines before pickup can be completed.'
							)
						);
					END IF;

					LEAVE hold_loop;
				END IF;

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
							'" was removed because your 24-hour fine grace period expired.'
						)
					);
				END IF;

				UPDATE hold_item
					 SET close_datetime = NOW(),
							 close_reason_id = v_close_reason_fine_id,
							 grace_started_at = NULL,
							 grace_expires_at = NULL,
							 pickup_ready_at = NULL,
							 pickup_expires_at = NULL
				 WHERE item_id = NEW.item_id
					 AND user_id = v_hold_user_id
					 AND request_datetime = v_hold_request_datetime
					 AND close_datetime IS NULL;

				ITERATE hold_loop;
			END IF;

			IF v_hold_pickup_expires_at IS NOT NULL THEN
				IF v_hold_pickup_expires_at > NOW() THEN
					LEAVE hold_loop;
				END IF;

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
							'" was canceled because the 72-hour pickup window expired.'
						)
					);
				END IF;

				UPDATE hold_item
					 SET close_datetime = NOW(),
							 close_reason_id = v_close_reason_pickup_expired_id,
							 grace_started_at = NULL,
							 grace_expires_at = NULL,
							 pickup_ready_at = NULL,
							 pickup_expires_at = NULL
				 WHERE item_id = NEW.item_id
					 AND user_id = v_hold_user_id
					 AND request_datetime = v_hold_request_datetime
					 AND close_datetime IS NULL;

				ITERATE hold_loop;
			END IF;

			UPDATE hold_item
				 SET pickup_ready_at = NOW(),
						 pickup_expires_at = DATE_ADD(NOW(), INTERVAL 72 HOUR),
						 grace_started_at = NULL,
						 grace_expires_at = NULL
			 WHERE item_id = NEW.item_id
				 AND user_id = v_hold_user_id
				 AND request_datetime = v_hold_request_datetime
				 AND close_datetime IS NULL
				 AND pickup_expires_at IS NULL;

			IF v_pickup_ready_type_id IS NOT NULL THEN
				INSERT INTO user_notification (
					user_id,
					item_id,
					notification_type,
					message
				)
				VALUES (
					v_hold_user_id,
					NEW.item_id,
					v_pickup_ready_type_id,
					CONCAT(
						'Your hold for "',
						COALESCE(v_item_title, NEW.item_id),
						'" is ready for pickup. Please collect it within 72 hours.'
					)
				);
			END IF;

			LEAVE hold_loop;
		END LOOP;

		CLOSE hold_cursor;
	END IF;
END;;

DELIMITER ;
