# Hotel BRMW - API (Node + Express + MySQL)

## Antes de começar
1. Banco `hotel_brmw` criado com `sql/01_ddl.sql` e `sql/02_carga.sql`.
2. `sql/04_api.sql` executado (troque a senha do usuário `hotel_app` antes).

## Rodar
    copy .env.example .env      (preencha as senhas e o JWT_SECRET)
    npm install
    npm run dev                 (http://localhost:3001)

Teste a conexão em http://localhost:3001/api/saude

## Criar login de funcionário
    npm run criar-usuario -- <id_funcionario> <login> <senha> <GERENTE|RECEPCAO>

## Rotas
    GET   /api/publico/dados                 quartos e períodos ocupados
    POST  /api/publico/reservas              solicitar reserva (transação)
    POST  /api/publico/reservas/consulta     consultar por protocolo + documento
    POST  /api/auth/login                    login do funcionário
    GET   /api/staff/dados                   dados para a conferência (exige login)
    PATCH /api/staff/reservas/:id/status     confirmar, recusar, check-in, check-out, cancelar
    POST  /api/staff/logout
