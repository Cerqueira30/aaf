-- Corre ANTES de começar o concurso a sério.
delete from votes;
delete from participations;
delete from vote_rate;
delete from photos;
update config set open = false, closes_at = null;
-- Depois, em Storage > photos, seleciona todos os ficheiros e apaga-os.
