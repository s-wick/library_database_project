DELIMITER ;;

-- Enforce the maximum number of simultaneous holds per user.
CREATE TRIGGER hold_cap
BEFORE INSERT ON hold_item
FOR EACH ROW
BEGIN
  -- Faculty have a larger shared limit across holds and borrows.
  DECLARE v_is_faculty     TINYINT(1) DEFAULT 0;
  DECLARE v_active_holds   INT        DEFAULT 0;
  DECLARE v_active_borrows INT        DEFAULT 0;
  DECLARE v_limit          INT        DEFAULT 3;

  SELECT COALESCE(is_faculty, 0)
    INTO v_is_faculty
    FROM user_account
   WHERE user_id = NEW.user_id
   LIMIT 1;

  SET v_limit = IF(v_is_faculty = 1, 6, 3);

  -- Count the user's currently open hold requests.
  SELECT COUNT(*)
    INTO v_active_holds
    FROM hold_item
   WHERE user_id = NEW.user_id
     AND close_datetime IS NULL;

  IF v_active_holds >= v_limit THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Hold limit reached: you have too many active holds.';
  END IF;

  -- Also block new holds when the user is already at the same borrow limit.
  SELECT COUNT(*)
    INTO v_active_borrows
    FROM borrow
   WHERE user_id = NEW.user_id
     AND return_date IS NULL;

  IF v_active_borrows >= v_limit THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Hold limit reached: you have too many active borrows.';
  END IF;
END;;

DELIMITER ;
