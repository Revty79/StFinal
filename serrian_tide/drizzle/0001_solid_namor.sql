CREATE TABLE "user_preferences" (
	"user_id" varchar(36) PRIMARY KEY NOT NULL,
	"theme" varchar(50) DEFAULT 'void',
	"background_image" varchar(255) DEFAULT 'nebula.png',
	"gear_image" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;