-- liquibase formatted sql

-- changeset ROOT:1 labels:init context:tg-users
-- comment: initial telegram_users table creation
CREATE TABLE public.telegram_users (
        user_id numeric NOT NULL,
        username text NULL,
        first_name text NULL,
        CONSTRAINT telegram_users_pk PRIMARY KEY (user_id)
);
CREATE UNIQUE INDEX telegram_users_user_id_uindex ON public.telegram_users (user_id);
-- rollback DROP TABLE IF EXISTS public.telegram_users;

-- changeset ROOT:2 labels:init context:xbox-live
-- comment: initial xbox_live table creation
CREATE TABLE public.xbox_live (
	not_found_count numeric NULL DEFAULT 0,
	user_id numeric NOT NULL,
	gamertag text NULL,
	gamerscore numeric NULL,
	manual_update bool NOT NULL DEFAULT false,
	month_start_score numeric NULL DEFAULT 0,
	CONSTRAINT xbox_live_pk PRIMARY KEY (user_id)
);
-- rollback DROP TABLE company;

-- changeset ROOT:3 labels:init context:xbot-game
-- comment: initial xbot_game table creation
CREATE TABLE public.xbot_game (
	chat_id numeric NOT NULL,
	user_id numeric NOT NULL,
	all_time_wins numeric NULL DEFAULT 0,
	active bool NULL DEFAULT true,
	current_year_wins numeric NULL DEFAULT 0,
	won_today bool NULL DEFAULT false,
	CONSTRAINT unique_game_id PRIMARY KEY (chat_id,user_id)
);
-- rollback ALTER TABLE person DROP COLUMN country;

-- changeset ROOT:4 labels:init context:chat-configs
-- comment: initial chat_configs table creation
CREATE TABLE public.chat_configs (
	changelog bool NULL DEFAULT false,
	mentions bool NULL DEFAULT true,
	chat_id numeric NOT NULL,
	bot_in_leaderboard bool NULL DEFAULT false,
	CONSTRAINT chat_configs_pk_1 PRIMARY KEY (chat_id)
);
-- rollback ALTER TABLE person DROP COLUMN country;

-- changeset ROOT:5 labels:init context:keyboard-ttl
-- comment: initial keyboard_ttl table creation
CREATE TABLE public.keyboard_ttl (
	chat_id numeric NOT NULL,
	keyboard_type text NOT NULL,
	message_id numeric NOT NULL,
	author_id numeric NOT NULL,
	keyboard_date timestamp NOT NULL,
	is_removed bool NOT NULL DEFAULT false,
	CONSTRAINT keyboard_ttl_pk_1 PRIMARY KEY (chat_id,keyboard_type)
);
-- rollback ALTER TABLE person DROP COLUMN country;
