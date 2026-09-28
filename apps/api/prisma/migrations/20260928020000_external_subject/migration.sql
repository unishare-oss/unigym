ALTER TABLE "Member" RENAME COLUMN "auth0Subject" TO "externalSubject";
ALTER INDEX "Member_auth0Subject_key" RENAME TO "Member_externalSubject_key";
