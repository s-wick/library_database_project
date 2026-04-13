-- sample-base-date: 2026-04-12
-- sample-shift-days: 0

INSERT INTO meeting_room (room_number, capacity, has_projector, has_whiteboard, has_tv)
VALUES
 ('101', 4, 1, 1, 1),
 ('102', 6, 0, 1, 1),
 ('201', 8, 1, 0, 0);

-- sample-shift-days-next: 0
INSERT INTO book_room (room_number, user_id, start_time, duration_hours)
VALUES
 ('101', 1, '2026-04-13 9:00:00', 2);

-- sample-shift-days-next: 0
INSERT INTO book_room (room_number, user_id, start_time, duration_hours)
VALUES
 ('101', 2, '2026-04-13 13:00:00', 1);

-- sample-shift-days-next: 0
INSERT INTO book_room (room_number, user_id, start_time, duration_hours)
VALUES
 ('102', 3, '2026-04-13 09:00:00', 3);

