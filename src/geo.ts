export function getCurrentGPS(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            'Location services are not supported on this device.'
          )
        );
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
  
        () => {
          reject(
            new Error(
              'Allow CertCue to use your location to clock in or out.'
            )
          );
        },
  
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }