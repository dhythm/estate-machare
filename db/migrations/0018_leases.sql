-- Rentals become lease agreements: whole months instead of days, with the
-- move-in costs fixed from the listing when the lease is requested.

delete from rentals;

alter table rentals rename to leases;
alter index rentals_seq_idx rename to leases_seq_idx;
alter index rentals_listing_id_idx rename to leases_listing_id_idx;
alter index rentals_renter_user_id_idx rename to leases_tenant_user_id_idx;

alter table leases rename column renter_user_id to tenant_user_id;
alter table leases rename column rent_per_day to rent_per_month;
alter table leases rename column days to months;

alter table leases
  add column deposit integer not null default 0,
  add column key_money integer not null default 0,
  add column initial_cost integer not null default 0;

alter table orders rename column source_rental_id to source_lease_id;
