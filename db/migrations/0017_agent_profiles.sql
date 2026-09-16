-- Carrier profiles become agent profiles: the categories an owner or a
-- licensed agent handles replace the vehicles a carrier drives.

delete from carrier_profiles;

alter table carrier_profiles rename to agent_profiles;
alter index carrier_profiles_seq_idx rename to agent_profiles_seq_idx;
alter table agent_profiles rename column vehicles to handled_categories;
