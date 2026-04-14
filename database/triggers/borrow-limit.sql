DELIMITER ;;

-- Enforce the maximum number of simultaneous borrows per user.
CREATE TRIGGER borrow_cap
BEFORE INSERT ON borrow
FOR EACH ROW
BEGIN
  -- Faculty can keep more active borrows than non-faculty users.
  DECLARE v_is_faculty   TINYINT(1) DEFAULT 0;
  DECLARE v_active_count INT        DEFAULT 0;
  DECLARE v_limit        INT        DEFAULT 3;

  SELECT COALESCE(is_faculty, 0)
    INTO v_is_faculty
    FROM user_account
   WHERE user_id = NEW.user_id
   LIMIT 1;

  SET v_limit = IF(v_is_faculty = 1, 6, 3);

  -- Count current unreturned borrows for the user attempting checkout.
  SELECT COUNT(*)
    INTO v_active_count
    FROM borrow
   WHERE user_id = NEW.user_id
     AND return_date IS NULL;

  IF v_active_count >= v_limit THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Borrow limit reached: you have too many active borrows.';
  END IF;
END;;

-- Fill in checkout and due dates when they were omitted by the insert.
CREATE TRIGGER borrow_due_date
BEFORE INSERT ON borrow
FOR EACH ROW
BEGIN
  -- Faculty loans last longer than standard user loans.
  DECLARE v_is_faculty TINYINT(1) DEFAULT 0;
  DECLARE v_borrow_days INT DEFAULT 7;

  SELECT COALESCE(is_faculty, 0)
    INTO v_is_faculty
    FROM user_account
   WHERE user_id = NEW.user_id
   LIMIT 1;

  SET v_borrow_days = IF(v_is_faculty = 1, 14, 7);

  -- Default the checkout timestamp to "now" if none was provided.
  IF NEW.checkout_date IS NULL THEN
    SET NEW.checkout_date = NOW();
  END IF;

  -- Derive the due date from the checkout time and user loan period.
  IF NEW.due_date IS NULL THEN
    SET NEW.due_date = DATE_ADD(NEW.checkout_date, INTERVAL v_borrow_days DAY);
  END IF;
END;;

DELIMITER ;
