DELIMITER ;;

-- Add a 24-hour grace period before canceling holds after an unpaid fine appears.
CREATE TRIGGER fines_delete_holds_insert
AFTER INSERT ON fined_for
FOR EACH ROW
BEGIN
	DECLARE v_grace_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_removed_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;

	-- Only unpaid or partially paid fines should affect hold lifecycle.
	IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
		SELECT notification_type_id
			INTO v_grace_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Hold grace started'
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_removed_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine (grace expired)'
		 LIMIT 1;

		IF v_close_reason_id IS NULL THEN
			SELECT reason_id
				INTO v_close_reason_id
				FROM hold_item_closing_reasons
			 WHERE reason_text = 'Canceled by fine'
			 LIMIT 1;
		END IF;

		-- Close open holds whose grace window has already expired.
		IF v_removed_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_removed_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" was removed because your 24-hour fine grace period expired.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL
				AND h.grace_expires_at IS NOT NULL
				AND h.grace_expires_at <= NOW();
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL
			 AND grace_expires_at IS NOT NULL
			 AND grace_expires_at <= NOW();

		-- Notify the user when an open hold enters grace.
		IF v_grace_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_grace_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" entered a 24-hour grace period because your account has unpaid fines. ',
					'Pay within 24 hours to keep this hold active.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL
				AND h.grace_expires_at IS NULL;
		END IF;

		-- Start grace only once for each currently open hold.
		UPDATE hold_item
			 SET grace_started_at = NOW(),
					 grace_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL
			 AND grace_expires_at IS NULL;
	END IF;
END;;

-- Manage grace/closure when an existing fine changes.
CREATE TRIGGER fines_delete_holds_update
AFTER UPDATE ON fined_for
FOR EACH ROW
BEGIN
	DECLARE v_grace_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_removed_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_has_unpaid_fines INT DEFAULT 0;

	IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
		SELECT notification_type_id
			INTO v_grace_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Hold grace started'
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_removed_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine (grace expired)'
		 LIMIT 1;

		IF v_close_reason_id IS NULL THEN
			SELECT reason_id
				INTO v_close_reason_id
				FROM hold_item_closing_reasons
			 WHERE reason_text = 'Canceled by fine'
			 LIMIT 1;
		END IF;

		IF v_removed_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_removed_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" was removed because your 24-hour fine grace period expired.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL
				AND h.grace_expires_at IS NOT NULL
				AND h.grace_expires_at <= NOW();
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL
			 AND grace_expires_at IS NOT NULL
			 AND grace_expires_at <= NOW();

		IF v_grace_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_grace_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" entered a 24-hour grace period because your account has unpaid fines. ',
					'Pay within 24 hours to keep this hold active.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL
				AND h.grace_expires_at IS NULL;
		END IF;

		UPDATE hold_item
			 SET grace_started_at = NOW(),
					 grace_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL
			 AND grace_expires_at IS NULL;
	END IF;

	-- If this update settles a fine and no unpaid fines remain, clear grace windows.
	IF NOT (COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0))
			 AND (COALESCE(OLD.amount, 0) > COALESCE(OLD.amount_paid, 0)) THEN
		SELECT COUNT(*)
			INTO v_has_unpaid_fines
			FROM fined_for f
		 WHERE f.user_id = NEW.user_id
			 AND COALESCE(f.amount, 0) > COALESCE(f.amount_paid, 0);

		IF v_has_unpaid_fines = 0 THEN
			UPDATE hold_item
				 SET grace_started_at = NULL,
						 grace_expires_at = NULL
			 WHERE user_id = NEW.user_id
				 AND close_datetime IS NULL;
		END IF;
	END IF;
END;;

DELIMITER ;
