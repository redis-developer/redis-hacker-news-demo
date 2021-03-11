import { Component } from "react"
import Highlighter from "react-highlight-words"

import "../../styles/components/search/item.css"

import renderCreatedTime from "../../utils/renderCreatedTime.js"

export default class extends Component {
  highlightText = (text) => {
    return (
      <Highlighter
        searchWords={this.props.searchQuery ? this.props.searchQuery.trim().split(" ") : [""]}
        textToHighlight={text}
        highlightClassName="search-highlighted-text"
      />
    )
  }

  renderItemFormattedText = (item) => {
    let textToRender

    if (item._highlightResult && item._highlightResult.text.matchedWords.length) {
      textToRender = item._highlightResult.text.value
    } else {
      textToRender = item.text
    }

    return (
      <span dangerouslySetInnerHTML={{ __html: textToRender }}></span>
    )
  }

  render () {
    const item = this.props.item

    return (
      <div className="search-results-item">
        <div className="search-results-item-data">
          <div className="search-results-item-title-and-link">
            <a className="search-results-item-title" href={`/item?id=${item.objectID}`}>
              {this.highlightText(item.title)}
            </a>
            {
              item.url ?
              <a className="search-results-item-link" href={item.url}>
                ({this.highlightText(item.url)})
              </a> : null
            }
          </div>
          <div className="search-results-item-details">
            <span>
              <a href={`/item?id=${item.objectID}`}>
                {item.points.toLocaleString()} {item.points === 1 ? "point" : "points"}
              </a>
            </span>
            <span className="search-results-item-details-separator">|</span>
            <span>
              <a href={`/user?id=${item.by}`}>
                {this.highlightText(item.by)}
              </a>
            </span>
            <span className="search-results-item-details-separator">|</span>
            <span>
              <a href={`/item?id=${item.objectID}`}>
                {renderCreatedTime(item.created)}
              </a>
            </span>
            <span className="search-results-item-details-separator">|</span>
            <span>
              <a href={`/item?id=${item.objectID}`}>
                {(item.commentCount).toLocaleString()} comments
              </a>
            </span>
          </div>
          {
            item.text ?
            <div className="search-results-item-text">
              {this.renderItemFormattedText(item)}
            </div> : null
          }
        </div>
      </div>
    )
  }
}
