-- Sample users and staff

INSERT INTO staff_account (email, password, first_name, middle_name, last_name, phone_number, is_admin)
VALUES
 ('librarian.staff@lib.com', {{SEED_STAFF_PASSWORD}}, 'Lauren', NULL, 'Mitchell', '555-0101', 0),
 ('admin.staff@lib.com', {{SEED_STAFF_PASSWORD}}, 'Rafael', NULL, 'Torres', '555-0102', 1);

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
VALUES
 ('student1.user@lib.com', {{SEED_USER_PASSWORD}}, 'Jeffrey', NULL, 'Carter', 0),
 ('student2.user@lib.com', {{SEED_USER_PASSWORD}}, 'Priya', NULL, 'Nair', 0),
 ('faculty.user@lib.com', {{SEED_USER_PASSWORD}}, 'Michael', NULL, 'Chen', 1);
