import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Container className="py-5 text-center">
      <h1>Página não encontrada</h1>
      <p className="text-secondary">O endereço não existe ou ainda não foi construído.</p>
      <Button as={Link} to="/">Voltar para a Home</Button>
    </Container>
  );
}