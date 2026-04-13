DELIMITER ;;

CREATE TRIGGER prevent_duplicate_active_borrow
BEFORE INSERT ON borrow
FOR EACH ROW
BEGIN
	DECLARE v_active_same_item INT DEFAULT 0;

	SELECT COUNT(*)
		INTO v_active_same_item
		FROM borrow
	 WHERE item_id = NEW.item_id
		 AND user_id = NEW.user_id
		 AND return_date IS NULL;

	IF v_active_same_item > 0 THEN
		SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Duplicate borrow blocked: item already checked out by this user.';
	END IF;
END;;

DELIMITER ;
