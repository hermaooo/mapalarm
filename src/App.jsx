import React, { useState, useEffect, useRef } from 'react';
import './styles.css'; 

export default function App() {
    const API_KEY = ""; 

    const mapRef = useRef(null);
    const searchInputRef = useRef(null);
    const googleMap = useRef(null);
    const centerMarker = useRef(null);
    const userMarker = useRef(null);
    const geofenceCircle = useRef(null);
    const alarmAudio = useRef(null);
    const autocomplete = useRef(null);

    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [geofenceCenter, setGeofenceCenter] = useState(null);
    const [radius, setRadius] = useState(500);
    const [triggerCondition, setTriggerCondition] = useState('enter');
    const [userPosition, setUserPosition] = useState(null);
    const [distance, setDistance] = useState(0);
    const [isInside, setIsInside] = useState(null);
    const [alarmActive, setAlarmActive] = useState(false);
    const [placeInfo, setPlaceInfo] = useState(null);
    const soundInterval = useRef(null); 

    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry,places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsApiLoaded(true);
        script.onerror = () => console.error("Erro ao carregar o script do Google Maps. Verifique sua chave de API.");
        document.head.appendChild(script);

        alarmAudio.current = new Audio('./alarm.mp3'); 
    }, [API_KEY]);

  useEffect(() => {
      if (!isApiLoaded || !mapRef.current) return;

      const defaultPosition = { lat: -23.55052, lng: -46.633308 }; // São Paulo como fallback

      // Função para inicializar o mapa (evita repetição de código)
      const initializeMap = (center) => {
          googleMap.current = new window.google.maps.Map(mapRef.current, {
              center: center,
              zoom: 15, // Zoom mais próximo para localização atual
              disableDefaultUI: true,
              zoomControl: true,
          });

          // Adiciona o listener de clique no mapa
          googleMap.current.addListener('click', (e) => {
              setGeofenceCenter(e.latLng.toJSON());
              setAlarmActive(false);
              setPlaceInfo(null);
              searchInputRef.current.value = '';
          });

          // Inicializa o Autocomplete
          autocomplete.current = new window.google.maps.places.Autocomplete(searchInputRef.current);
          autocomplete.current.addListener('place_changed', () => {
              const place = autocomplete.current.getPlace();
              if (place.geometry && place.geometry.location) {
                  const newCenter = place.geometry.location.toJSON();
                  setGeofenceCenter(newCenter);
                  googleMap.current.setCenter(newCenter);
                  googleMap.current.setZoom(15);
                  setPlaceInfo({ name: place.name, address: place.formatted_address });
              }
          });
      };

      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  // Sucesso: usa a localização do usuário
                  const userLocation = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                  };
                  initializeMap(userLocation);
              },
              () => {
                  console.warn("Permissão de localização negada. Usando localização padrão.");
                  initializeMap(defaultPosition);
              }
          );
      } else {
          console.error("Geolocalização não é suportada por este navegador.");
          initializeMap(defaultPosition);
      }

  }, [isApiLoaded]);
    
  useEffect(() => {
        if (!isApiLoaded) return;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserPosition(newPos);
            },
            (error) => console.error("Erro ao obter localização:", error),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isApiLoaded]);

    useEffect(() => {
        if (!googleMap.current) return;
        if (geofenceCenter) {
            if (!centerMarker.current) {
                centerMarker.current = new window.google.maps.Marker({ map: googleMap.current });
            }
            centerMarker.current.setPosition(geofenceCenter);
            if (!geofenceCircle.current) {
                geofenceCircle.current = new window.google.maps.Circle({
                    map: googleMap.current,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.2,
                });
            }
            geofenceCircle.current.setCenter(geofenceCenter);
            geofenceCircle.current.setRadius(radius);
        }
        if (userPosition) {
            if (!userMarker.current) {
                userMarker.current = new window.google.maps.Marker({
                    map: googleMap.current,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    },
                });
            }
            userMarker.current.setPosition(userPosition);
        }
    }, [geofenceCenter, radius, userPosition]);

    useEffect(() => {
        if (!userPosition || !geofenceCenter) return;
        const currentDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(userPosition),
            new window.google.maps.LatLng(geofenceCenter)
        );
        setDistance(currentDistance);
        const currentlyIsInside = currentDistance <= radius;
        if (isInside === null) {
            setIsInside(currentlyIsInside);
            return;
        }
        if (currentlyIsInside !== isInside) {
            if ((currentlyIsInside && triggerCondition === 'enter') || (!currentlyIsInside && triggerCondition === 'leave')) {
                setAlarmActive(true);
            }
        }
        setIsInside(currentlyIsInside);
    }, [userPosition, geofenceCenter, radius, triggerCondition, isInside]);

    useEffect(() => {
        setAlarmActive(false); 
    }, [triggerCondition]);

    useEffect(() => {
      if (alarmActive) {
          alarmAudio.current.play();
          soundInterval.current = setInterval(() => {
              alarmAudio.current.play();
          }, 2000); 
      } else {
          clearInterval(soundInterval.current);
          alarmAudio.current.pause(); 
          alarmAudio.current.currentTime = 0; 
      }

      return () => {
          clearInterval(soundInterval.current);
      };
  }, [alarmActive]); 

    const handleRadiusChange = (e) => {
        const newValue = Number(e.target.value);

        if (newValue > 5000) {
            const snappedValue = Math.round(newValue / 500) * 500;
            setRadius(snappedValue);
        } else {
            setRadius(newValue);
        }
    };

    return (
      <div className="app-container">
          <div ref={mapRef} className="map-container" />

          <div className="controls-overlay">
              <div className="controls-container animate-fade-in">
                  <div className="title">Localizador com Geofence</div>
                  <div className="subtitle">Busque um local ou clique no mapa para definir o centro.</div>
                  
                  <input
                      ref={searchInputRef}
                      id="pac-input"
                      type="text"
                      placeholder="Buscar endereço..."
                  />

                  {geofenceCenter && (
                      <>
                          {placeInfo && (
                              <div className="place-info-card-container">
                              </div>
                          )}

                          <div className="controls-section">
                              <label className="control-label" htmlFor="radius">Raio: {radius} metros</label>
                              
                              <input
                                  type="range"
                                  id="radius"
                                  className="radius-slider"
                                  min="100"
                                  max="15000"
                                  step="100"   
                                  value={radius}
                                  onChange={handleRadiusChange} 
                              />

                              <div className="controls-selection">
                                  <label className="control-label trigger-label" htmlFor="trigger">Acionar alarme ao:</label>
                                  <select id="trigger" className="control-select" value={triggerCondition} onChange={(e) => setTriggerCondition(e.target.value)}>
                                      <option value="enter">Entrar na área</option>
                                      <option value="leave">Sair da área</option>
                                  </select>
                              </div>
                          </div>
                      </>
                  )}

                  <div className="status">
                      <p className="status-text"><strong>Status:</strong> {isInside ? 'Dentro da área' : 'Fora da área'}</p>
                      <p className="status-text"><strong>Distância:</strong> {distance > 0 ? `${distance.toFixed(0)} metros` : 'N/A'}</p>                  
                  </div>

                  {alarmActive && (
                      <button className="alarm-reset-button" onClick={() => setAlarmActive(false)}>
                          ALARME ATIVO! (Resetar)
                      </button>
                  )}
              </div>
          </div>

          {!API_KEY.startsWith("AIza") && (
              <div className="api-key-alert">
                  Atenção: A chave da API do Google Maps é inválida ou está faltando.
              </div>
          )}
      </div>
    );
}