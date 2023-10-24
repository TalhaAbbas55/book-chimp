import React, { useEffect, useState } from 'react';
import ePub from 'epubjs';
import "./style.css"
function EpubPaginationViewer() {
    const [pageIndex, setPageIndex] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [book, setBook] = useState(null);
    const [searchContent, setSearchContent] = useState("");
    const [renditions, setRenditions] = useState(null);
    // Load the EPUB file
    console.log(searchResults, 'searchResults')
    useEffect(() => {
        const bookUrl = 'https://react-reader.metabits.no/files/alice.epub';
        const book1 = ePub(bookUrl);
        setBook(book1);

        var rendition = book1.renderTo('viewer', {
            manager: 'continuous',
            flow: 'scrolled',
            width: '100%',
            height: '100%',
        });
        setRenditions(rendition);

        // Display the initial page
        var displayed = rendition.display(pageIndex);

        // Cleanup when the component unmounts
        return () => {
            book1.destroy();
        };
    }, [pageIndex]);

    const goToNextPage = () => {
        setPageIndex(pageIndex + 1);
    };

    const goToPreviousPage = () => {
        if (pageIndex > 0) {
            setPageIndex(pageIndex - 1);
        }
    };

    const handleSearch = async (searchText) => {
        if (searchText) {
            const searchRegex = new RegExp(searchText, 'gi');
            console.log(searchRegex, 'searchRegex')
            const foundLocations = [];

            // Iterate over spine items (sections) to search for text
            for (const section of book.spine.spineItems) {
                if (section.isNav) {
                    // Skip navigation items
                    continue;
                }

                // Wait for the section to load
                await section.load(book.load.bind(book));

                // Use the `find` method to search within the section
                const searchResultsInSection = section.find(searchText);

                if (searchResultsInSection.length > 0) {
                    // Modify the search results to replace search text with a <span>
                    const modifiedResults = searchResultsInSection.map((result) => {
                        const excerptWithSpan = result.excerpt.replace(searchRegex, (match) => (
                            `<span class="textFound">${match}</span>`
                        ));

                        return {
                            cfi: result.cfi,
                            excerpt: excerptWithSpan,
                        };
                    });

                    foundLocations.push(...modifiedResults);
                }
            }

            // Update the state with search results
            setSearchResults(foundLocations);
        } else {
            setSearchResults([]);
        }
    };


    const handleNavigation = (cfi) => {
        console.log(cfi, 'cfi')
        renditions.display(cfi)

    }

    return (
        <div>


            <input
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchContent(e.target.value)}
            />
            <button onClick={() => handleSearch(searchContent)}>
                Search
            </button>

            <div>
                <div id="viewer"></div>
                <div style={{ display: 'flex', justifyContent: "space-between" }}>
                    <button onClick={goToPreviousPage}>Previous Page</button>
                    <button onClick={goToNextPage}>Next Page</button>
                </div>
            </div>
            <div>
                <h2>Search Results:</h2>
                <ul >
                    {searchResults.map((result, index) => (
                        <li key={index}>
                            <div onClick={() => handleNavigation(result.cfi)}>
                                <span style={{ color: "red" }}>Excerpt:</span>
                                <span
                                    className='desc'
                                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}

export default EpubPaginationViewer;
