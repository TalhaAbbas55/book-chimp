import React, { useEffect, useState } from 'react';
import { ReactReader } from 'react-reader';
import Epub from 'epubjs'; // Use a library like epub.js for EPUB parsing

const App = () => {
  const [location, setLocation] = useState('initial_location_value_here');

  const locationChanged = (epubcifi) => {
    setLocation(epubcifi);
  };

  useEffect(() => {
    // Load and parse the EPUB content
    const book = new Epub("https://react-reader.metabits.no/files/alice.epub/");

    book.loaded.metadata.then((data) => {
      // Access book metadata and content for searching
      // You can loop through chapters and pages and search within each
      console.log(data, 'data')
    });
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <ReactReader
        url="https://react-reader.metabits.no/files/alice.epub/"
        location={location}
        locationChanged={locationChanged}
      />
    </div>
  );
};

export default App;
