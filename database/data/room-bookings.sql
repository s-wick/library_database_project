INSERT INTO meeting_room (room_number, capacity, has_projector, has_whiteboard, has_tv)
VALUES
 ('101', 4, 1, 1, 1),
 ('102', 6, 0, 1, 1),
 ('201', 8, 1, 0, 0);

INSERT INTO book_room (room_number, user_id, start_time, duration_hours)
VALUES
 ('101', 1, '2026-04-15 10:00:00', 2),
 ('101', 2, '2026-04-15 13:00:00', 1),
 ('102', 3, '2026-04-16 09:00:00', 3);

