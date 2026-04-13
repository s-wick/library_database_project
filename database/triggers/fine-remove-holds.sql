DELIMITER ;;

CREATE TRIGGER fines_delete_holds_insert
AFTER INSERT ON fined_for
FOR EACH ROW
BEGIN
	DECLARE v_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;

	IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
		SELECT notification_type_id
			INTO v_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine'
		 LIMIT 1;

		IF v_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" was removed because your account has unpaid fines.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL;
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL;
	END IF;
END;;

CREATE TRIGGER fines_delete_holds_update
AFTER UPDATE ON fined_for
FOR EACH ROW
BEGIN
	DECLARE v_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;

	IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0)
		 AND NOT (COALESCE(OLD.amount, 0) > COALESCE(OLD.amount_paid, 0)) THEN
		SELECT notification_type_id
			INTO v_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine'
		 LIMIT 1;

		IF v_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" was removed because your account has unpaid fines.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL;
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL;
	END IF;
END;;

DELIMITER;