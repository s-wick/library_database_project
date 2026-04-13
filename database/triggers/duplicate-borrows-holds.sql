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

CREATE TRIGGER prevent_duplicate_active_hold
BEFORE INSERT ON hold_item
FOR EACH ROW
BEGIN
	DECLARE v_active_same_hold INT DEFAULT 0;

	SELECT COUNT(*)
		INTO v_active_same_hold
		FROM hold_item
	 WHERE item_id = NEW.item_id
		 AND user_id = NEW.user_id
		 AND close_datetime IS NULL;

	IF v_active_same_hold > 0 THEN
		SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Duplicate hold blocked: item already on hold for this user.';
	END IF;
END;;

CREATE TRIGGER prevent_hold_if_borrowed
BEFORE INSERT ON hold_item
FOR EACH ROW
BEGIN
	DECLARE v_active_same_borrow INT DEFAULT 0;

	SELECT COUNT(*)
		INTO v_active_same_borrow
		FROM borrow
	 WHERE item_id = NEW.item_id
		 AND user_id = NEW.user_id
		 AND return_date IS NULL;

	IF v_active_same_borrow > 0 THEN
		SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Hold blocked: item is already checked out by this user.';
	END IF;
END;;

DELIMITER ;
