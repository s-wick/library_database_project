DELIMITER ;;

-- Refresh a user's overdue fines whenever they log in.
CREATE TRIGGER fine_accrual_and_cap_user_login AFTER UPDATE ON user_account
FOR EACH ROW
BEGIN
	-- Daily late fees are capped at the item's replacement value.
	DECLARE v_daily_rate DECIMAL(8,2) DEFAULT 5.00;

	-- Only recalculate when the login timestamp actually changes.
	IF NEW.last_login <> OLD.last_login THEN
		-- Recompute each overdue fine and keep prior payments from exceeding the new cap.
		INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
		SELECT b.item_id,
					 b.user_id,
					 b.checkout_date,
					 LEAST(
						 ROUND(
							 GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0)
							 * v_daily_rate,
							 2
						 ),
						 COALESCE(i.monetary_value, 0)
					 ) AS amount,
					 0
		FROM borrow b
		INNER JOIN item i ON i.item_id = b.item_id
		WHERE b.user_id = NEW.user_id
			AND TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())) > 0
		ON DUPLICATE KEY UPDATE
			amount = VALUES(amount),
			amount_paid = LEAST(COALESCE(amount_paid, 0), VALUES(amount));
	END IF;
END;;

-- Refresh all overdue fines before producing a revenue report.
CREATE TRIGGER fine_accrual_and_cap_revenue_report AFTER INSERT ON report_generated
FOR EACH ROW
BEGIN
	DECLARE v_report_type VARCHAR(30) DEFAULT '';
	DECLARE v_daily_rate DECIMAL(8,2) DEFAULT 5.00;

	-- Only the revenue report needs up-to-date fine totals.
	SELECT rt.report_type
		INTO v_report_type
		FROM report_types rt
	 WHERE rt.report_type_id = NEW.report_type
	 LIMIT 1;

	IF v_report_type = 'revenue' THEN
		-- Recompute overdue balances and cap each fine at item value.
		INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
		SELECT b.item_id,
					 b.user_id,
					 b.checkout_date,
					 LEAST(
						 ROUND(
							 GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0)
							 * v_daily_rate,
							 2
						 ),
						 COALESCE(i.monetary_value, 0)
					 ) AS amount,
					 0
		FROM borrow b
		INNER JOIN item i ON i.item_id = b.item_id
		WHERE TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())) > 0
		ON DUPLICATE KEY UPDATE
			amount = VALUES(amount),
			amount_paid = LEAST(COALESCE(amount_paid, 0), VALUES(amount));
	END IF;
END;;

DELIMITER ;
