SELECT * FROM hold_item;

CREATE TABLE hold_item_closing_reasons (
    reason_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    reason_text VARCHAR(30) NOT NULL,

    PRIMARY KEY (reason_id)
)

INSERT INTO hold_item_closing_reasons (reason_text)
VALUES
    ("Fulfilled"),
    ("Canceled"),
    ("Canceled by fine");

DROP TABLE hold_item;

CREATE TABLE hold_item (
    item_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    request_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    close_datetime DATETIME DEFAULT NULL,
    close_reason_id INT UNSIGNED DEFAULT NULL,

    PRIMARY KEY (item_id, user_id, request_datetime),
    FOREIGN KEY (item_id) REFERENCES item (`item_id`),
    FOREIGN KEY (user_id) REFERENCES user_account (`user_id`),
    FOREIGN KEY (close_reason_id) REFERENCES hold_item_closing_reasons (`reason_id`)
);