import StarRating from 'react-native-star-rating';
import React from "react"
export default class RatingUser extends React.Component {
 
  render() {
    return (
      <StarRating
        disabled={false}
        emptyStar={'star-border'}
        fullStar={'star'}
        halfStar={'star-half'}
        halfStarEnabled={!this.props.halfStarEnabled}
        iconSet={'MaterialIcons'}
        maxStars={5}
        rating={this.props.starCount}
        selectedStar={(rating) => this.props.selected(rating)}
        fullStarColor={'#FFE300'}
        emptyStarColor={'#676767'}
        starSize={this.props.starSize}
        starStyle={{marginHorizontal: this.props.marginHorizontal}}
        disabled={this.props.disabled}
      />
    );
  }
}
 