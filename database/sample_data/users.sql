-- Sample users and staff

INSERT INTO staff_account (email, password, first_name, middle_name, last_name, phone_number, is_admin)
VALUES
	('lauren.mitchell@lib.com', 'password123', 'Lauren', NULL, 'Mitchell', '555-0101', 0),
	('rafael.torres@lib.com', 'password123', 'Rafael', NULL, 'Torres', '555-0102', 1);

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
VALUES
	('jamie.carter@lib.com', 'password123', 'Jamie', NULL, 'Carter', 0),
	('priya.nair@lib.com', 'password123', 'Priya', NULL, 'Nair', 0),
	('michael.chen@lib.com', 'password123', 'Michael', NULL, 'Chen', 1);
