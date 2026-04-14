DELIMITER ;;

-- Prevent a user from opening the same borrow twice at the same time.
CREATE TRIGGER prevent_duplicate_active_borrow
BEFORE INSERT ON borrow
FOR EACH ROW
BEGIN
	DECLARE v_active_same_item INT DEFAULT 0;

	-- Look for another unreturned borrow for this user/item pair.
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

-- Prevent a user from placing the same hold more than once while it is still open.
CREATE TRIGGER prevent_duplicate_active_hold
BEFORE INSERT ON hold_item
FOR EACH ROW
BEGIN
	DECLARE v_active_same_hold INT DEFAULT 0;

	-- Look for an existing active hold on the same item for the same user.
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

-- Do not allow a hold when the same user already has the item checked out.
CREATE TRIGGER prevent_hold_if_borrowed
BEFORE INSERT ON hold_item
FOR EACH ROW
BEGIN
	DECLARE v_active_same_borrow INT DEFAULT 0;

	-- Check whether the item is already actively borrowed by this user.
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
