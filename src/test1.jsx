import React, { useEffect, useState } from "react";
import ePub from "epubjs";
import "./style.css";
function EpubPaginationViewer() {
    const [pageIndex, setPageIndex] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [book, setBook] = useState(null);
    const [currentBook, setCurrentBook] = useState("Sway");
    const [searchContent, setSearchContent] = useState("");
    const [renditions, setRenditions] = useState(null);
    const [highLightSearchedWords, setHighLightSearchedWords] = useState(false);
    const [chaptersName, setChaptersName] = useState([]);
    const [chapterIndexes, setChapterIndexes] = useState([]);
    const [currentBookUrl, setCurrentBookUrl] = useState("https://react-reader.metabits.no/files/alice.epub")
    const [singleBookSearchResults, setSingleBookSearchResults] = useState([]);
    const [books, setBooks] = useState([
        {
            title: "Alice",
            url: "https://react-reader.metabits.no/files/alice.epub",
        },
        {
            title: "Sway",
            url: "https://react-reader.metabits.no/files/alice.epub",
        },
        // Add more books as needed
    ]);
    // Load the EPUB file
    useEffect(() => {

        const book1 = ePub(currentBookUrl);
        setBook(book1);


        var rendition = book1.renderTo("viewer", {
            manager: "continuous",
            flow: "scrolled",
            width: "100%",
            height: "100%",
        });
        // Call the function with the TOC data
        book1.loaded.navigation.then(function (toc) {
            let allIndexes = [];
            book1.spine.spineItems.forEach((item) => {

                const chapterIndex = {
                    href: item.href,
                    index: item.index,
                }
                allIndexes.push(chapterIndex)
            })

            setChapterIndexes(allIndexes)



            extractChapterNames(toc.toc, book1);
        });



        setRenditions(rendition);

        // Display the initial page
        var displayed = rendition.display(pageIndex);

        if (highLightSearchedWords && searchContent) {
            setTimeout(() => {
                highlightMatchedSectionsOnPage(
                    pageIndex,
                    searchContent,
                    book1,
                    rendition
                );
            }, 200);
            setHighLightSearchedWords(false);
        }

        // Cleanup when the component unmounts
        return () => {
            book1.destroy();
        };
    }, [pageIndex]);

    function extractChapterNames(toc, bookState, parentTitle = "") {
        let allChapters = [];

        for (const entry of toc) {
            // Combine the parent title with the current entry title
            const chapterTitle = parentTitle + entry.label;


            // Display the chapter title
            const chapter = {
                title: chapterTitle,
                href: entry.href
            };
            allChapters.push(chapter);
            // Find the corresponding chapter data in the TOC


            // If the entry has subitems, recurse into them
            if (entry.subitems && entry.subitems.length > 0) {
                extractChapterNames(entry.subitems, bookState, chapterTitle + " > ");
            }
        }



        setChaptersName(allChapters);
    }

    const goToNextPage = (searchText) => {
        setPageIndex(pageIndex + 1);
        setHighLightSearchedWords(true);
    };

    const goToPreviousPage = (searchText) => {
        if (pageIndex > 0) {
            setPageIndex(pageIndex - 1);
            setHighLightSearchedWords(true);
        }
    };

    const handleSearch = async (searchText) => {
        setSearchResults([]);
        if (searchText) {
            const searchRegex = new RegExp(searchText, "gi");
            const foundLocations = [];

            searchResults.map((result, index) => {
                renditions.annotations.remove(result.cfi, "underline");
                renditions.annotations.remove(result.cfi, "highlight");
            });

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
                        const excerptWithSpan = result.excerpt.replace(
                            searchRegex,
                            (match) => `<span class="textFound">${match}</span>`
                        );
                        // renditions.annotations.underline(result.cfi, {}, (e) => { // change color here

                        // }, 'newTextFound',);
                        renditions.annotations.underline(result.cfi, {}, (e) => {
                            // change color here
                        });
                        renditions.annotations.highlight(result.cfi, {}, (e) => {
                            // change color here
                        });

                        return {
                            cfi: result.cfi,
                            excerpt: excerptWithSpan,
                        };
                    });

                    foundLocations.push(...modifiedResults);
                }
            }

            // Update the state with search results
            setSingleBookSearchResults(foundLocations);
        } else {
            setSingleBookSearchResults([]);
        }
    };

    const highlightMatchedSectionsOnPage = async (
        pageNumber,
        searchText,
        bookState,
        renditionState
    ) => {
        if (searchText && bookState.spine.spineItems[pageNumber]) {
            const searchRegex = new RegExp(searchText, "gi");

            // Iterate over spine items (sections) to search for text

            const section = bookState.spine.spineItems[pageNumber];
            if (section.isNav) {
                return false;
            }

            // Wait for the section to load
            await section.load(bookState.load.bind(bookState));

            // Use the `find` method to search within the section
            const searchResultsInSection = section.find(searchText);

            if (searchResultsInSection.length > 0) {
                // Modify the search results to replace search text with a <span>

                const modifiedResults = searchResultsInSection.map((result) => {
                    // renditions.annotations.underline(result.cfi, {}, (e) => { // change color here

                    // }, 'newTextFound',);

                    renditionState.annotations.underline(result.cfi, {}, (e) => {
                        // change color here
                    });
                    renditionState.annotations.highlight(result.cfi, {}, (e) => {
                        // change color here
                    });
                });
            }
        }
    };

    const handleNavigation = (cfi) => {
        renditions.display(cfi);
    };
    const changeBook = (url, cfi) => {

        book.destroy();

        const book1 = ePub(url);
        setBook(book1);
        var rendition = book1.renderTo("viewer", {
            manager: "continuous",
            flow: "scrolled",
            width: "100%",
            height: "100%",
        });
        setRenditions(rendition);

        rendition.display(cfi);


        console.log(url, cfi);
    }
    const handleMultiBookNavigation = (cfi) => {
        if (cfi.bookTitle === currentBook) {

            renditions.display(cfi.cfi);
        } else {
            const newBook = books.find((book) => book.title === cfi.bookTitle);
            console.log(newBook, 'newBook')
            setCurrentBookUrl(newBook.url)
            changeBook(newBook.url, cfi.cfi);
        }

    };

    useEffect(() => {
        if (renditions) {
            // Apply a class to selected text for highlighting
            renditions.on("selected", (cfiRange) => {
                renditions.annotations.highlight(cfiRange, {}, (e) => { });
            });

            // Set a theme for highlighting
            renditions.themes.default({
                "::selection": {
                    background: "rgba(255, 255, 0, 0.3)",
                },
                ".epubjs-hl": {
                    fill: "yellow",
                    "fill-opacity": "0.3",
                    "mix-blend-mode": "multiply",
                },
            });
        }
    }, [renditions]);

    const handleChapterNavigation = (chapter) => {
        for (let i = 0; i < chapterIndexes.length; i++) {
            const singleChapter = chapterIndexes[i];
            if (singleChapter.href === chapter.href) {
                setPageIndex(singleChapter.index);
            }

        }

    }







    const handleMultiBooksSearch = async (searchText) => {
        setSingleBookSearchResults([]);
        if (searchText) {
            const combinedResults = [];

            for (const book of books) {
                const bookInstance = ePub(book.url);
                const searchRegex = new RegExp(searchText, "gi");
                const foundLocations = [];

                // Load the book
                await bookInstance.ready;

                // Iterate over spine items (sections) to search for text
                for (const section of bookInstance.spine.spineItems) {
                    if (section.isNav) {
                        // Skip navigation items
                        continue;
                    }

                    // Wait for the section to load
                    await section.load(bookInstance.load.bind(bookInstance));

                    // Use the `find` method to search within the section
                    const searchResultsInSection = section.find(searchText);

                    if (searchResultsInSection.length > 0) {
                        // Modify the search results to replace search text with a <span>
                        const modifiedResults = searchResultsInSection.map((result) => {
                            const excerptWithSpan = result.excerpt.replace(
                                searchRegex,
                                (match) => `<span class="textFound">${match}</span>`
                            );
                            return {
                                bookTitle: book.title,
                                cfi: result.cfi,
                                excerpt: excerptWithSpan,
                            };
                        });

                        foundLocations.push(...modifiedResults);
                    }
                }

                combinedResults.push(...foundLocations);
            }

            // Update the state with search results
            setSearchResults(combinedResults);
            console.log(combinedResults)

        } else {
            setSearchResults([]);
        }
    };



    return (
        <div>
            <h1>Single Book Search</h1>

            <input
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchContent(e.target.value)}
            />
            <button onClick={() => handleSearch(searchContent)}>Search</button>

            <h1>Multi book search</h1>
            <input
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchContent(e.target.value)}
            />
            <button onClick={() => handleMultiBooksSearch(searchContent)}>Search</button>

            <div>
                <div id="viewer-container">
                    <div id="viewer" style={{ height: "70vh" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => goToPreviousPage(searchContent)}>
                        Previous Page
                    </button>
                    <button onClick={() => goToNextPage(searchContent)}>Next Page</button>
                </div>
            </div>
            <ol>
                {chaptersName.map((chapter, index) => (
                    <li key={index}>
                        <div onClick={() => handleChapterNavigation(chapter)}>
                            <span style={{ color: "red" }}>Chapter:</span>

                            <span
                                className="desc"
                                dangerouslySetInnerHTML={{ __html: chapter.title }}
                            />

                        </div>
                    </li>
                ))}
            </ol>
            <div>
                <h2>Search Results:</h2>
                <ul>
                    {searchResults.map((result, index) => (
                        <li key={index}>
                            <div onClick={() => handleMultiBookNavigation(result)}>
                                <span style={{ color: "red" }}>Excerpt:</span>
                                <span
                                    className="desc"
                                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
                <ul>
                    {singleBookSearchResults?.map((result, index) => (
                        <li key={index}>
                            <div onClick={() => handleNavigation(result.cfi)}>
                                <span style={{ color: "red" }}>Excerpt:</span>
                                <span
                                    className="desc"
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
