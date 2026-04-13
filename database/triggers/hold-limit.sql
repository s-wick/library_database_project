DELIMITER ;;

CREATE TRIGGER hold_cap
BEFORE INSERT ON hold_item
FOR EACH ROW
BEGIN
  DECLARE v_is_faculty   TINYINT(1) DEFAULT 0;
  DECLARE v_active_count INT        DEFAULT 0;
  DECLARE v_limit        INT        DEFAULT 3;

  SELECT COALESCE(is_faculty, 0)
    INTO v_is_faculty
    FROM user_account
   WHERE user_id = NEW.user_id
   LIMIT 1;

  SET v_limit = IF(v_is_faculty = 1, 6, 3);

  SELECT COUNT(*)
    INTO v_active_count
    FROM hold_item
   WHERE user_id = NEW.user_id
     AND close_datetime IS NULL;

  IF v_active_count >= v_limit THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Hold limit reached: you have too many active holds.';
  END IF;
END;;

DELIMITER ;