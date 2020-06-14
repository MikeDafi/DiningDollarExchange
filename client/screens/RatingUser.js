import StarRating from 'react-native-star-rating';
import React from "react"
export default class RatingUser extends React.Component {
 
  render() {
    return (
      <StarRating
        disabled={false}
        emptyStar={'star'}
        fullStar={'star'}
        iconSet={'Entypo'}
        maxStars={5}
        rating={this.props.starCount}
        selectedStar={(rating) => this.props.selected(rating)}
        fullStarColor={'#FFE300'}
        emptyStarColor={'#676767'}
        starSize={37}
        starStyle={{marginHorizontal:-3}}
      />
    );
  }
}
 