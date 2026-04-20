DELIMITER ;;

-- Cancel active holds and notify users when an item is withdrawn from catalog.
CREATE TRIGGER cancel_holds_on_item_withdraw
AFTER UPDATE ON item
FOR EACH ROW
BEGIN
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_notification_type_id INT UNSIGNED DEFAULT NULL;

	IF COALESCE(OLD.is_withdrawn, 0) = 0 AND COALESCE(NEW.is_withdrawn, 0) = 1 THEN
		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled - item withdrawn from catalog'
		 LIMIT 1;

		IF v_close_reason_id IS NULL THEN
			SELECT reason_id
				INTO v_close_reason_id
				FROM hold_item_closing_reasons
			 WHERE reason_text = 'Canceled'
			 LIMIT 1;
		END IF;

		SELECT notification_type_id
			INTO v_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Hold canceled - item withdrawn'
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
					'" was canceled because this item was withdrawn from catalog.'
				)
			FROM hold_item h
			INNER JOIN item i ON i.item_id = h.item_id
			WHERE h.item_id = NEW.item_id
				AND h.close_datetime IS NULL;
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id,
					 grace_started_at = NULL,
					 grace_expires_at = NULL,
					 pickup_ready_at = NULL,
					 pickup_expires_at = NULL
		 WHERE item_id = NEW.item_id
			 AND close_datetime IS NULL;
	END IF;
END;;

DELIMITER ;
