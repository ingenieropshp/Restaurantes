export default function RestaurantCard({ res, esAdmin, seleccionado, setSeleccionado, favoritos, setFavoritos, estado, adminActions }) {
  // Aquí pones el contenido de tu .map((res) => { ... })
  return (
    <div className="restaurant-card aparecer" onClick={() => !esAdmin && setSeleccionado(res)}>
       {/* Contenido de la tarjeta (imagen, badges, info) */}
    </div>
  );
}